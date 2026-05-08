package com.cognizant.hospease.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

@FeignClient(name = "room-service") // Matches your teammate's service name
public interface RoomClient {

    @GetMapping("/api/rooms/count/total")
    long getTotalRoomCount();

    @GetMapping("/api/rooms/count/occupied")
    long getOccupiedRoomCount();
}