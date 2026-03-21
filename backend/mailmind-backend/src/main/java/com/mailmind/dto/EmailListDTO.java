//package com.mailmind.dto;
//
//import lombok.Data;
//import java.time.LocalDateTime;
//
//@Data
//public class EmailListDTO {
//    private String id;
//    private String from;
//    private String subject;
//    private String preview;
//    private LocalDateTime date;
//    private Boolean isRead;
//    private Boolean isStarred;
//    private String threadId;
//}

package com.mailmind.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EmailListDTO {
    private String id;
    private String from;
    private String subject;
    private String preview;
    private LocalDateTime date;
    private Boolean isRead;
    private Boolean isStarred;
    private String threadId;
    private Boolean isReplied; // ← added for replied badge + ReplyHistory trigger
}