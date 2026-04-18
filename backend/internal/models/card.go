package models

type Card struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"not null" json:"name"`
	Type        string `gorm:"not null" json:"type"`
	Description string `gorm:"not null" json:"description"`

	UpgradeToID *uint `json:"upgradeToId"`
	UpgradeTo   *Card `gorm:"foreignKey:UpgradeToID" json:"upgradeTo,omitempty"`
}
