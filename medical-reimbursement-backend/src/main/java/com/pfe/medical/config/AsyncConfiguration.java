package com.pfe.medical.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@EnableAsync
@Slf4j
public class AsyncConfiguration implements AsyncConfigurer {

    @Bean(name = "aiAnalysisExecutor")
    public Executor aiAnalysisExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // ✅ Configuration du pool de threads
        executor.setCorePoolSize(5);              // 5 threads minimum actifs
        executor.setMaxPoolSize(20);              // 20 threads maximum
        executor.setQueueCapacity(100);           // File d'attente de 100 tâches
        executor.setThreadNamePrefix("IA-Analysis-");
        executor.setKeepAliveSeconds(60);
        
        // ✅ Politique de rejet : enregistrer dans les logs
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        
        // ✅ Attendre que toutes les tâches se terminent avant shutdown
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        
        executor.initialize();
        
        log.info("✅ Thread pool IA Analysis configuré : core={}, max={}, queue={}", 
            executor.getCorePoolSize(), 
            executor.getMaxPoolSize(), 
            executor.getQueueCapacity()
        );
        
        return executor;
    }

    @Override
    public Executor getAsyncExecutor() {
        return aiAnalysisExecutor();
    }
}
