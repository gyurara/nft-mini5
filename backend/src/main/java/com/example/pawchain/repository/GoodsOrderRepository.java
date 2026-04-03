package com.example.pawchain.repository;

import com.example.pawchain.model.GoodsOrder;
import com.example.pawchain.model.GoodsOrder.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GoodsOrderRepository extends JpaRepository<GoodsOrder, Long> {

    List<GoodsOrder> findByOwnerAddressIgnoreCaseOrderByCreatedAtDesc(String ownerAddress);

    List<GoodsOrder> findByStatus(OrderStatus status);
}
