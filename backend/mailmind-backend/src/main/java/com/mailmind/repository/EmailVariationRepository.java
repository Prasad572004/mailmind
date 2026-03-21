package com.mailmind.repository;

import com.mailmind.model.EmailVariation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmailVariationRepository extends JpaRepository<EmailVariation, Long> {
    List<EmailVariation> findByCampaignId(Long campaignId);
}
