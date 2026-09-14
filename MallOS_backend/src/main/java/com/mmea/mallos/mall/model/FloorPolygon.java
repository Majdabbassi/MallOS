package com.mmea.mallos.mall.model;

import com.mmea.mallos.mall.model.enums.PolygonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "floor_polygons")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class FloorPolygon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "floor_id")
    private Floor floor;

    /**
     * JSON array of normalized {x, y} points in [0.0–1.0] relative to Floor.width/height.
     * Stored as a MySQL JSON column. Serialized/deserialized via Jackson in the service layer.
     */
    @Column(columnDefinition = "JSON", nullable = false)
    private String points;

    @Column
    private String label;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PolygonType polygonType = PolygonType.STORE;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
