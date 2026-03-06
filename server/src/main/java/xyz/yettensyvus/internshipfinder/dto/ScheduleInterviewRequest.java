package xyz.yettensyvus.internshipfinder.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class ScheduleInterviewRequest {
    private Date interviewAt;
    private String location;
}
