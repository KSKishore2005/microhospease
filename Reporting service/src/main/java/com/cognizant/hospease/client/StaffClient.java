package com.cognizant.hospease.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// identity-service is the name of your teammate's module in Eureka
@FeignClient(name = "identity-service")
public interface StaffClient {

    @GetMapping("/api/staff/{id}")
    Object getStaffById(@PathVariable("id") Long id);
}