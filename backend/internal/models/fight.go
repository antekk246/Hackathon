package models

import "gorm.io/datatypes"

type Fight struct {
	ID                  uint           `gorm:"primaryKey" json:"id"`
	Cards               datatypes.JSON `json:"cards"`
	PlayerTurn          bool           `json:"playerTurn"`
	CurrentPlayerHealth uint           `json:"currentPlayerHealth"`
	EnemyID             uint           `json:"enemyId"`
	Enemy               *Enemy         `gorm:"foreignKey:EnemyID" json:"enemy,omitempty"`
}

type Enemy struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	IsBoss       bool           `json:"isBoss"`
	EnemyContent datatypes.JSON `json:"enemyContent"`
	EnemyLevel   uint           `json:"enemyLevel"`
}
