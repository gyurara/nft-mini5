package com.example.pawchain.controller;

import com.example.pawchain.model.GoodsOrder;
import com.example.pawchain.model.GoodsOrder.OrderStatus;
import com.example.pawchain.repository.GoodsOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class GoodsOrderController {

    @Autowired
    private GoodsOrderRepository goodsOrderRepository;

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody GoodsOrder order) {
        if (order.getOwnerAddress() == null || order.getOwnerAddress().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "지갑 주소가 필요합니다."));
        }
        if (order.getGoodsType() == null || order.getGoodsType().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "굿즈 종류가 필요합니다."));
        }
        order.setOwnerAddress(order.getOwnerAddress().toLowerCase());
        order.setStatus(OrderStatus.PENDING);
        GoodsOrder saved = goodsOrderRepository.save(order);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{address}")
    public List<GoodsOrder> getMyOrders(@PathVariable String address) {
        return goodsOrderRepository.findByOwnerAddressIgnoreCaseOrderByCreatedAtDesc(address);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        if (statusStr == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "status 값이 필요합니다."));
        }
        OrderStatus status;
        try {
            status = OrderStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "유효하지 않은 status 값입니다."));
        }
        return goodsOrderRepository.findById(id)
            .map(order -> {
                order.setStatus(status);
                return ResponseEntity.ok(goodsOrderRepository.save(order));
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
