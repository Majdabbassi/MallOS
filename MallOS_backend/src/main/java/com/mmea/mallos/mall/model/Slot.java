package com.mmea.mallos.mall.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "slots",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_slot_polygon", columnNames = "polygon_id"),
                @UniqueConstraint(name = "uq_slot_store",   columnNames = "store_id")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Slot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "floor_id")
    private Floor floor;

    /**
     * The polygon this slot is attached to.
     * One polygon → at most one slot.
     */
    @OneToOne(optional = false)
    @JoinColumn(name = "polygon_id")
    private FloorPolygon polygon;

    /**
     * The store currently assigned to this polygon.
     * Nullable — null means the unit is unassigned/vacant.
     */
    @ManyToOne
    @JoinColumn(name = "store_id")
    private Store store;
}
