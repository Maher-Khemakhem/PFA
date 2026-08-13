package tn.fst.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventParticipationEvent {
    private String eventId;
    private String eventTitle;
    private String participantEmail;
    private String organizerEmail;
}