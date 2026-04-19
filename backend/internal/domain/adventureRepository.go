package domain

import (
	"backend/internal/models"
	"encoding/json"
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
		// Omit chroni przed modyfikacją tabeli źródłowej kart
		if err := tx.Omit("Cards.*").Create(adventure).Error; err != nil {
			return err
		}

		// 1. ZBUDUJ I POTASUJ TALIĘ GRACZA
		var startingDeck []uint
		for _, card := range adventure.Cards {
			startingDeck = append(startingDeck, card.ID)
		}

		rand.Shuffle(len(startingDeck), func(i, j int) {
			startingDeck[i], startingDeck[j] = startingDeck[j], startingDeck[i]
		})

		var initialHand []uint
		var remainingDeck []uint

		handSize := 4
		if len(startingDeck) < 4 {
			handSize = len(startingDeck)
		}

		initialHand = startingDeck[:handSize]
		remainingDeck = startingDeck[handSize:]

		// Serializacja
		handBytes, _ := json.Marshal(initialHand)
		deckBytes, _ := json.Marshal(remainingDeck)

		handJSON := datatypes.JSON(handBytes)
		deckJSON := datatypes.JSON(deckBytes)
		emptyJSON := datatypes.JSON([]byte(`[]`))

		var lastRoomID *uint
		advLevel := adventure.Level

		// 2. GENEROWANIE POKOI
		for i := roomCount; i > 0; i-- {
			specificLevel := advLevel + uint(rand.Intn(3))
			isBossRoom := (i == roomCount)

			var roomType string
			if isBossRoom {
				roomType = "fight"
				specificLevel += 2
			} else {
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

			if roomType == "fight" {
				var encounterIDs []uint

				// Szukamy odpowiednich zasianych scenariuszy
				err := tx.Model(&models.Encounter{}).
					Where("level = ? AND is_boss = ?", specificLevel, isBossRoom).
					Pluck("id", &encounterIDs).Error

				if err != nil {
					return fmt.Errorf("failed to fetch encounters: %w", err)
				}

				if len(encounterIDs) == 0 {
					err = tx.Model(&models.Encounter{}).
						Where("is_boss = ?", isBossRoom).
						Pluck("id", &encounterIDs).Error

					if err != nil || len(encounterIDs) == 0 {
						return fmt.Errorf("database missing required encounter data (isBoss: %v)", isBossRoom)
					}
				}

				// Losujemy scenariusz
				randomEncounterID := encounterIDs[rand.Intn(len(encounterIDs))]

				// Pobieramy scenariusz Z DOŁĄCZONYM POTWOREM (Preload), żeby odczytać jego BaseHealth
				var selectedEncounter models.Encounter
				if err := tx.Preload("Enemy").First(&selectedEncounter, randomEncounterID).Error; err != nil {
					return fmt.Errorf("failed to load encounter details: %w", err)
				}

				// 3. TWORZYMY AKTYWNĄ INSTANCJĘ WALKI (FIGHT)
				fight := models.Fight{
					EnemyID:             selectedEncounter.EnemyID,
					PlayerTurn:          true,
					DecisionPoints:      3, // Startowa mana/punkty akcji gracza
					CurrentPlayerHealth: adventure.PlayerHealth,

					// Skoro pobraliśmy potwora (Preload), możemy przypisać mu startowe HP!
					CurrentEnemyHealth: selectedEncounter.Enemy.BaseHealth,
					MaxEnemyHealth:     selectedEncounter.Enemy.BaseHealth,

					Cards:       handJSON, // 4 wylosowane karty na ręce
					CardsInDeck: deckJSON, // Reszta kart w talii
					UsedCards:   emptyJSON,
				}

				if err := tx.Create(&fight).Error; err != nil {
					return err
				}
				room.FightID = &fight.ID

			} else {
				// Tworzenie Eventu
				reward := models.Reward{
					RewardLevel:   specificLevel,
					RewardContent: datatypes.JSON([]byte(fmt.Sprintf(`{"gold": %d}`, specificLevel*25))),
				}
				if err := tx.Create(&reward).Error; err != nil {
					return err
				}

				event := models.Event{
					RewardID:    &reward.ID,
					CardsOnHand: handJSON, // Podpinamy karty
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
