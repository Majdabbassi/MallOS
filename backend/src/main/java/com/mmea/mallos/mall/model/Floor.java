package com.mmea.mallos.mall.model;

import com.mmea.mallos.mall.model.enums.FloorStatus;
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
@Table(name = "floors")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Floor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mall_id")
    private Mall mall;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int level;

    @Column(name = "source_image_url")
    private String sourceImageUrl;

    @Column(nullable = false)
    @Builder.Default
    private int width = 1000;

    @Column(nullable = false)
    @Builder.Default
    private int height = 1000;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private FloorStatus status = FloorStatus.UPLOADED;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
