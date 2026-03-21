//package com.mailmind.dto;
//
//import lombok.Data;
//import java.time.LocalDateTime;
//
//@Data
//public class EmailDTO {
//    private String id;
//    private String from;
//    private String to;           // ✅ Extra fields for detailed view
//    private String subject;
//    private String body;         // ✅ Extra fields for detailed view
//    private LocalDateTime date;
//    private Boolean isRead;
//    private Boolean isStarred;
//    private String threadId;
//}

package com.mailmind.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EmailDTO {
    private String id;
    private String from;
    private String to;
    private String subject;
    private String body;
    private LocalDateTime date;
    private Boolean isRead;
    private Boolean isStarred;
    private String threadId;

    // Smart Reply fields
    private Boolean isReplied;
    private LocalDateTime repliedAt;
}