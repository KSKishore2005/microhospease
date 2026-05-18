package com.cognizant.billing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class BillingInvoiceServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BillingInvoiceServiceApplication.class, args);
    }
}
