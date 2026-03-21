package com.mailmind.service;

import com.mailmind.model.Campaign;
import com.mailmind.model.EmailVariation;
import com.mailmind.model.User;
import com.mailmind.repository.CampaignRepository;
import com.mailmind.repository.EmailVariationRepository;
import com.mailmind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final EmailVariationRepository emailVariationRepository;
    private final UserRepository userRepository;
    private final AIService aiService;

    // Get all campaigns for a user
    public List<Campaign> getAllCampaigns(String email) {
        User user = getUserByEmail(email);
        return campaignRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    // Get single campaign
    public Campaign getCampaignById(Long id, String email) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Campaign not found"));
        if (!campaign.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized access to campaign");
        }
        return campaign;
    }

    // Create campaign + generate AI email variations
    @Transactional
    public Campaign createCampaign(String title, String roughIdea, String email) {
        User user = getUserByEmail(email);

        // Save campaign first
        Campaign campaign = Campaign.builder()
                .title(title)
                .roughIdea(roughIdea)
                .status("DRAFT")
                .user(user)
                .build();
        campaign = campaignRepository.save(campaign);

        // Generate AI email variations
        List<Map<String, Object>> variations = aiService.generateEmailVariations(roughIdea);

        // Save each variation
        final Campaign savedCampaign = campaign;
        variations.forEach(v -> {
            EmailVariation variation = EmailVariation.builder()
                    .tone((String) v.get("tone"))
                    .subjectLine((String) v.get("subjectLine"))
                    .body((String) v.get("body"))
                    .predictedOpenRate(((Number) v.get("predictedOpenRate")).doubleValue())
                    .campaign(savedCampaign)
                    .build();
            emailVariationRepository.save(variation);
        });

        log.info("Campaign created with {} variations for user: {}", variations.size(), email);
        return campaignRepository.findById(campaign.getId()).orElse(campaign);
    }

    // Update campaign status
    public Campaign updateCampaignStatus(Long id, String status, String email) {
        Campaign campaign = getCampaignById(id, email);
        campaign.setStatus(status);
        return campaignRepository.save(campaign);
    }

    // Delete campaign
    @Transactional
    public void deleteCampaign(Long id, String email) {
        Campaign campaign = getCampaignById(id, email);
        campaignRepository.delete(campaign);
    }

    // Get email variations for a campaign
    public List<EmailVariation> getVariations(Long campaignId, String email) {
        getCampaignById(campaignId, email); // verify ownership
        return emailVariationRepository.findByCampaignId(campaignId);
    }

    // Select a variation as chosen
    public EmailVariation selectVariation(Long variationId, String email) {
        EmailVariation variation = emailVariationRepository.findById(variationId)
                .orElseThrow(() -> new RuntimeException("Variation not found"));

        // Deselect all others in same campaign
        List<EmailVariation> others = emailVariationRepository
                .findByCampaignId(variation.getCampaign().getId());
        others.forEach(v -> {
            v.setIsSelected(false);
            emailVariationRepository.save(v);
        });

        // Select this one
        variation.setIsSelected(true);
        return emailVariationRepository.save(variation);
    }

    // Helper
    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
