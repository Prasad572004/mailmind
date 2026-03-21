package com.mailmind.repository;

import com.mailmind.model.SmartReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SmartReplyRepository extends JpaRepository<SmartReply, Long> {
    List<SmartReply> findByUserIdOrderByCreatedAtDesc(Long userId);
}
