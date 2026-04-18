package models

type Adventure struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	Name   string `gorm:"not null" json:"name"`
	UserID uint   `gorm:"not null;uniqueIndex" json:"userId"`
	Buffs  []Buff `gorm:"many2many:adventure_buffs;" json:"buffs"`
	Cards  []Card `gorm:"many2many:adventure_cards;" json:"cards"`

	Rooms         []Room `gorm:"foreignKey:AdventureID" json:"rooms"`
	CurrentRoomID uint   `json:"currentRoomId"`

	Level        uint `gorm:"not null" json:"level"`
	Progress     uint `gorm:"not null" json:"progress"`
	PlayerHealth uint `json:"playerHealth"`
}
