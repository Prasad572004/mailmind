package com.mailmind.repository;

import com.mailmind.model.SmartReply;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SmartReplyRepository extends JpaRepository<SmartReply, Long> {

    // For history page — limited to 20
    List<SmartReply> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // For any code still using without pageable
    List<SmartReply> findByUserIdOrderByCreatedAtDesc(Long userId);

    // For analytics — fast count
    long countByUserId(Long userId);
}