package models

import "gorm.io/datatypes"

type Buff struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	BuffContent datatypes.JSON `json:"buffContent"`
}
