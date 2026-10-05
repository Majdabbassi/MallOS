package com.mmea.mallos.audit;

import com.mmea.mallos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Writes the history. {@link #record} joins the caller's transaction, so an operation that fails and rolls back
 * leaves no entry, and an operation that succeeds always leaves one.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    static final String SYSTEM = "system";

    private final AuditRepository repository;
    private final UserRepository users;

    @Transactional(propagation = Propagation.REQUIRED)
    public void record(Long actorId, Long mallId, String action, String entityType, Long entityId,
                       Integer floorLevel, String summary) {
        String actor = actorId == null ? SYSTEM
                : users.findById(actorId).map(u -> u.getUsername()).orElse("user " + actorId);
        repository.save(AuditEntry.builder()
                .mallId(mallId).actorId(actorId).actorName(actor).action(action).entityType(entityType)
                .entityId(entityId).floorLevel(floorLevel)
                .summary(summary.length() > 600 ? summary.substring(0, 597) + "..." : summary)
                .createdAt(LocalDateTime.now()).build());
    }

    /** Newest first; the filters are optional and combine. */
    @Transactional(readOnly = true)
    public List<AuditEntry> history(Long mallId, String actor, Integer floor, String entityType, String action, int limit) {
        int size = Math.max(1, Math.min(limit, 200));
        return repository.findByMallIdOrderByCreatedAtDescIdDesc(mallId, PageRequest.of(0, 1000)).stream()
                .filter(e -> actor == null || actor.isBlank() || e.getActorName().toLowerCase().contains(actor.trim().toLowerCase()))
                .filter(e -> floor == null || floor.equals(e.getFloorLevel()))
                .filter(e -> entityType == null || entityType.isBlank() || e.getEntityType().equalsIgnoreCase(entityType.trim()))
                .filter(e -> action == null || action.isBlank() || e.getAction().toLowerCase().startsWith(action.trim().toLowerCase()))
                .limit(size)
                .toList();
    }
}
