package com.example.pawchain.controller;

import com.example.pawchain.model.GoodsOrder;
import com.example.pawchain.model.GoodsOrder.OrderStatus;
import com.example.pawchain.repository.GoodsOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class GoodsOrderController {

    @Autowired
    private GoodsOrderRepository goodsOrderRepository;

    /**
     * Node.js가 관리하는 pet_profiles.nft_count를 직접 수정하기 위해 JdbcTemplate 사용
     * (두 백엔드가 동일한 MySQL DB를 공유)
     */
    @Autowired
    private JdbcTemplate jdbcTemplate;

    // ✅ 전체 조회 (테스트용 + 405 방지)
    @GetMapping
    public List<GoodsOrder> getAllOrders() {
        return goodsOrderRepository.findAll();
    }

    // ✅ 주문 생성 - NFT 할인권 교환 시 nft_count 차감
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody GoodsOrder order) {

        if (order.getOwnerAddress() == null || order.getOwnerAddress().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "지갑 주소가 필요합니다."));
        }
        if (order.getGoodsType() == null || order.getGoodsType().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "굿즈 종류가 필요합니다."));
        }

        String ownerAddr = order.getOwnerAddress().toLowerCase();
        order.setOwnerAddress(ownerAddr);

        // NFT 보유 수량 확인 후 차감 (할인권 교환)
        try {
            Integer nftCount = jdbcTemplate.queryForObject(
                    "SELECT nft_count FROM pet_profiles WHERE account = ?",
                    Integer.class,
                    ownerAddr
            );
            if (nftCount == null || nftCount <= 0) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "NFT 보유량이 부족합니다. NFT를 먼저 발행해주세요.")
                );
            }
            // nft_count 1개 차감 (할인권 1개 사용)
            jdbcTemplate.update(
                    "UPDATE pet_profiles SET nft_count = nft_count - 1 WHERE account = ? AND nft_count > 0",
                    ownerAddr
            );
        } catch (org.springframework.dao.EmptyResultDataAccessException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "등록된 반려동물 프로필이 없습니다.")
            );
        } catch (Exception e) {
            // pet_profiles 테이블이 아직 없거나 접근 불가 시 경고만 남기고 진행
            System.err.println("[GoodsOrder] nft_count 차감 실패 (무시): " + e.getMessage());
        }

        order.setStatus(OrderStatus.PENDING);

        GoodsOrder saved = goodsOrderRepository.save(order);
        return ResponseEntity.ok(saved);
    }

    // ✅ 주소 기반 조회
    @GetMapping("/owner/{address}")
    public List<GoodsOrder> getMyOrders(@PathVariable("address") String address) {
        return goodsOrderRepository
                .findByOwnerAddressIgnoreCaseOrderByCreatedAtDesc(address.toLowerCase());
    }

    // ✅ ID 단건 조회 (추가)
    @GetMapping("/id/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable("id") Long id) {
        return goodsOrderRepository.findByIdQuery(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ✅ 상태 변경
    @PatchMapping("/id/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> body) {

        String statusStr = body.get("status");

        if (statusStr == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "status 값이 필요합니다."));
        }

        OrderStatus status;
        try {
            status = OrderStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "유효하지 않은 status 값입니다."));
        }

        return goodsOrderRepository.findByIdQuery(id)
                .map(order -> {
                    order.setStatus(status);
                    return ResponseEntity.ok(goodsOrderRepository.save(order));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
