package com.noithat.qlnt.backend.service.notification;

import org.springframework.lang.Nullable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Small wrapper to publish notifications to WebSocket topics.
 * The bean is optional; if SimpMessagingTemplate is not present nothing will be sent.
 */
@Component
public class NotificationPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationPublisher(@Nullable SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishToCustomer(Integer customerId, Object payload) {
        if (messagingTemplate == null) return;
        // send to a customer-specific queue
        messagingTemplate.convertAndSend("/queue/notifications/" + customerId, payload);
    }

    public void publishToTopic(String topic, Object payload) {
        if (messagingTemplate == null) return;
        messagingTemplate.convertAndSend(topic, payload);
    }
}
