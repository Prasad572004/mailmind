//package com.mailmind.controller;
//
//import com.mailmind.service.AnalyticsService;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.core.annotation.AuthenticationPrincipal;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.web.bind.annotation.*;
//import java.util.Map;
//
//@RestController
//@RequestMapping("/api/analytics")
//@RequiredArgsConstructor
//public class AnalyticsController {
//
//    private final AnalyticsService analyticsService;
//
//    // GET dashboard overview stats
//    @GetMapping("/overview")
//    public ResponseEntity<?> getOverview(@AuthenticationPrincipal UserDetails userDetails) {
//        try {
//            return ResponseEntity.ok(analyticsService.getDashboardStats(userDetails.getUsername()));
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
//        }
//    }
//}

package com.mailmind.controller;

import com.mailmind.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    public ResponseEntity<?> getOverview(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(
                analyticsService.getDashboardStats(userDetails.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
