package models

import "gorm.io/datatypes"

type Card struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"not null" json:"name"`
	TypeID      *uint          `gorm:"not null" json:"typeId"`
	Type        *CardType      `gorm:"foreignKey:TypeID" json:"type,omitempty"`
	Description string         `gorm:"not null" json:"description"`
	UpgradeToID *uint          `json:"upgradeToId"`
	UpgradeTo   *Card          `gorm:"foreignKey:UpgradeToID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"upgradeTo,omitempty"`
	CardAction  datatypes.JSON `json:"cardAction"`
	Adventures  []Adventure    `gorm:"many2many:adventure_cards;" json:"adventures,omitempty"`
}

type CardType struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `gorm:"not null" json:"name"`
}
