package com.mailmind.repository;

import com.mailmind.model.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Campaign> findByUserIdAndStatus(Long userId, String status);
    long countByUserId(Long userId);
}
