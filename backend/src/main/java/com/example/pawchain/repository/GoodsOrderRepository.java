package com.example.pawchain.repository;

import com.example.pawchain.model.GoodsOrder;
import com.example.pawchain.model.GoodsOrder.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface GoodsOrderRepository extends JpaRepository<GoodsOrder, Long> {

    @Query("SELECT g FROM GoodsOrder g WHERE LOWER(g.ownerAddress) = LOWER(:addr) ORDER BY g.createdAt DESC")
    List<GoodsOrder> findByOwnerAddressIgnoreCaseOrderByCreatedAtDesc(@Param("addr") String addr);

    @Query("SELECT g FROM GoodsOrder g WHERE g.status = :status")
    List<GoodsOrder> findByStatus(@Param("status") OrderStatus status);

    @Query("SELECT g FROM GoodsOrder g WHERE g.id = :id")
    Optional<GoodsOrder> findByIdQuery(@Param("id") Long id);
}
