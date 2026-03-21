package com.mailmind.repository;

import com.mailmind.model.EmailReply;
import com.mailmind.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmailReplyRepository extends JpaRepository<EmailReply, Long> {

    // Reply history for one email, oldest first
    List<EmailReply> findByEmailIdOrderBySentAtAsc(String emailId);

    // Reply history for one email by specific user, oldest first
    List<EmailReply> findByEmailIdAndUserOrderBySentAtAsc(String emailId, User user);

    // All replies by a user, newest first — used for Sent folder
    List<EmailReply> findByUserOrderBySentAtDesc(User user);
}