package com.mailmind.controller;

import com.mailmind.service.CampaignService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/campaigns")
@RequiredArgsConstructor
public class CampaignController {

    private final CampaignService campaignService;

    // GET all campaigns
    @GetMapping
    public ResponseEntity<?> getAllCampaigns(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(campaignService.getAllCampaigns(userDetails.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET single campaign
    @GetMapping("/{id}")
    public ResponseEntity<?> getCampaign(@PathVariable Long id,
                                          @AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(campaignService.getCampaignById(id, userDetails.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // POST create campaign + AI generate variations
    @PostMapping
    public ResponseEntity<?> createCampaign(@RequestBody Map<String, String> request,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(campaignService.createCampaign(
                    request.get("title"),
                    request.get("roughIdea"),
                    userDetails.getUsername()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT update campaign status
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                           @RequestBody Map<String, String> request,
                                           @AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(campaignService.updateCampaignStatus(
                    id, request.get("status"), userDetails.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE campaign
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCampaign(@PathVariable Long id,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        try {
            campaignService.deleteCampaign(id, userDetails.getUsername());
            return ResponseEntity.ok(Map.of("message", "Campaign deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET email variations for a campaign
    @GetMapping("/{id}/variations")
    public ResponseEntity<?> getVariations(@PathVariable Long id,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(campaignService.getVariations(id, userDetails.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT select a variation
    @PutMapping("/variations/{variationId}/select")
    public ResponseEntity<?> selectVariation(@PathVariable Long variationId,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(campaignService.selectVariation(variationId, userDetails.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
