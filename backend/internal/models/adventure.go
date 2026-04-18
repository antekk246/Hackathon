package models

type Adventure struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	Name   string `gorm:"not null" json:"name"`
	UserID uint   `gorm:"not null;uniqueIndex" json:"userId"`
	Buffs  []Buff `gorm:"many2many:adventure_buffs;" json:"buffs"`
}
