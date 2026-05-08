package com.cognizant.hospease.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "operational-service") // Matches your teammate's service name
public interface OperationalClient {

    @GetMapping("/api/shifts/count")
    long getShiftCount();

    @GetMapping("/api/tasks/count/completed")
    long getCompletedTaskCount(@RequestParam("staffId") Long staffId);
}