//package com.mailmind.repository;
//
//import com.mailmind.model.Email;
//import com.mailmind.model.User;
//import org.springframework.data.jpa.repository.JpaRepository;
//import org.springframework.data.jpa.repository.Query;
//import org.springframework.data.repository.query.Param;
//import java.util.List;
//import java.util.Optional;
//
//public interface EmailRepository extends JpaRepository<Email, String> {
//    
//    // Find emails by user
//    List<Email> findByUserOrderByReceivedAtDesc(User user);
//    
//    // Find unread emails
//    List<Email> findByUserAndIsReadFalseOrderByReceivedAtDesc(User user);
//    
//    // Find emails by thread (conversation)
//    List<Email> findByThreadIdOrderByReceivedAtAsc(String threadId);
//    
//    // Search emails
//    @Query("SELECT e FROM Email e WHERE e.user = :user AND " +
//           "(LOWER(e.subject) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
//           "LOWER(e.from) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
//           "LOWER(e.body) LIKE LOWER(CONCAT('%', :query, '%'))) " +
//           "ORDER BY e.receivedAt DESC")
//    List<Email> searchEmails(@Param("user") User user, @Param("query") String query);
//    
//    // Check if email exists
//    Optional<Email> findByUserAndEmailId(User user, String emailId);
//    
//    // Count unread emails
//    Long countByUserAndIsReadFalse(User user);
//    
//    // Find inbox emails (not spam, not trash)
//    @Query("SELECT e FROM Email e WHERE e.user = :user AND e.isSpam = false AND e.isTrash = false " +
//           "ORDER BY e.receivedAt DESC")
//    List<Email> findInboxEmails(@Param("user") User user);
//}

package com.mailmind.repository;

import com.mailmind.model.Email;
import com.mailmind.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmailRepository extends JpaRepository<Email, String> {

    // Find emails by user
    List<Email> findByUserOrderByReceivedAtDesc(User user);

    // Find unread emails
    List<Email> findByUserAndIsReadFalseOrderByReceivedAtDesc(User user);

    // Find emails by thread (conversation)
    List<Email> findByThreadIdOrderByReceivedAtAsc(String threadId);

    // Search emails by subject, from, or body
    @Query("SELECT e FROM Email e WHERE e.user = :user AND " +
           "(LOWER(e.subject) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.from) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(e.body) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY e.receivedAt DESC")
    List<Email> searchEmails(@Param("user") User user, @Param("query") String query);

    // Find a specific email belonging to a user
    Optional<Email> findByUserAndEmailId(User user, String emailId);

    // Count unread emails
    Long countByUserAndIsReadFalse(User user);

    // Find inbox emails (not spam, not trash)
    @Query("SELECT e FROM Email e WHERE e.user = :user AND e.isSpam = false AND e.isTrash = false " +
           "ORDER BY e.receivedAt DESC")
    List<Email> findInboxEmails(@Param("user") User user);
}