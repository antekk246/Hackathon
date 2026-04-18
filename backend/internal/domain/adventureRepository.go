package domain

import (
	"backend/internal/models"
	"fmt"
	"math/rand"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type AdventureRepository interface {
	GetByID(id uint) (*models.Adventure, error)
	GetByUserID(userID uint) (*models.Adventure, error)
	Create(adventure *models.Adventure) error
	Update(adventure *models.Adventure) error
	DeleteSecure(id uint, userID uint) error
	DeleteByUserID(userID uint) error
}

type gormAdventureRepo struct {
	DB *gorm.DB
}

func NewAdventureRepository(db *gorm.DB) AdventureRepository {
	return &gormAdventureRepo{DB: db}
}

func (r *gormAdventureRepo) GetByID(id uint) (*models.Adventure, error) {
	var adventure models.Adventure
	if err := r.DB.Preload("Buffs").Preload("Cards").First(&adventure, id).Error; err != nil {
		return nil, err
	}
	return &adventure, nil
}

func (r *gormAdventureRepo) GetByUserID(userID uint) (*models.Adventure, error) {
	var adventure models.Adventure
	// Preload("Buffs") automatically fetches the many-to-many relationship
	if err := r.DB.Preload("Buffs").Preload("Cards").Where("user_id = ?", userID).First(&adventure).Error; err != nil {
		return nil, err
	}
	return &adventure, nil
}

func (r *gormAdventureRepo) Create(adventure *models.Adventure) error {
	roomCount := 5 * adventure.Level

	return r.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit("Cards").Create(adventure).Error; err != nil {
			return err
		}

		var lastRoomID *uint
		advLevel := adventure.Level

		// Generate Rooms in REVERSE
		for i := roomCount; i > 0; i-- {
			specificLevel := advLevel + uint(rand.Intn(3))

			// 1. Identify if this is the final room (Boss Room)
			isBossRoom := (i == roomCount)

			var roomType string
			if isBossRoom {
				roomType = "fight"
				specificLevel += 2 // Boost the boss level by 2!
			} else {
				// Normal room logic: 25% Events, 75% Fights
				roomType = "fight"
				if rand.Float32() < 0.25 {
					roomType = "event"
				}
			}

			room := models.Room{
				AdventureID: adventure.ID,
				Type:        roomType,
				NextRoomID:  lastRoomID,
			}

			// If you eventually add an "IsBoss" boolean to your Room model,
			// you can easily set it here:
			// room.IsBoss = isBossRoom

			if roomType == "fight" {
				var enemyIDs []uint

				// Fetch matching enemies based on BOTH level and the isBoss flag
				err := tx.Model(&models.Enemy{}).
					Where("enemy_level = ? AND is_boss = ?", specificLevel, isBossRoom).
					Pluck("id", &enemyIDs).Error

				if err != nil {
					return fmt.Errorf("failed to fetch enemies: %w", err)
				}

				// FALLBACK: If you don't have a boss at this exact specificLevel yet,
				// fall back to fetching ANY enemy that matches the boss requirement.
				if len(enemyIDs) == 0 {
					err = tx.Model(&models.Enemy{}).
						Where("is_boss = ?", isBossRoom).
						Pluck("id", &enemyIDs).Error

					if err != nil || len(enemyIDs) == 0 {
						return fmt.Errorf("database missing required enemy data (isBoss: %v)", isBossRoom)
					}
				}

				// Pick a random enemy from the results
				randomEnemyID := enemyIDs[rand.Intn(len(enemyIDs))]

				fight := models.Fight{
					EnemyID:             randomEnemyID,
					PlayerTurn:          true,
					CurrentPlayerHealth: 100,
					Cards:               datatypes.JSON([]byte(`[]`)),
				}

				if err := tx.Create(&fight).Error; err != nil {
					return err
				}
				room.FightID = &fight.ID

			} else {
				// Event Logic
				reward := models.Reward{
					RewardLevel:   specificLevel,
					RewardContent: datatypes.JSON([]byte(fmt.Sprintf(`{"gold": %d}`, specificLevel*25))),
				}
				if err := tx.Create(&reward).Error; err != nil {
					return err
				}

				event := models.Event{
					RewardID:    &reward.ID,
					CardsOnHand: datatypes.JSON([]byte(`[]`)),
				}
				if err := tx.Create(&event).Error; err != nil {
					return err
				}
				room.EventID = &event.ID
			}

			if err := tx.Create(&room).Error; err != nil {
				return err
			}

			lastRoomID = &room.ID
		}

		return tx.Model(adventure).Update("CurrentRoomID", *lastRoomID).Error
	})
}
func (r *gormAdventureRepo) Update(adventure *models.Adventure) error {
	return r.DB.Save(adventure).Error
}

func (r *gormAdventureRepo) DeleteSecure(adventureID uint, userID uint) error {
	// This only deletes if BOTH the ID and the UserID match
	result := r.DB.Where("id = ? AND user_id = ?", adventureID, userID).Delete(&models.Adventure{})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}
func (r *gormAdventureRepo) DeleteByUserID(userID uint) error {
	return r.DB.Where("user_id = ?", userID).Delete(&models.Adventure{}).Error
}
