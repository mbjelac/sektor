# Destroy

# WaterWells

## Construction

duration=2000

## Function

EnergyElectric 3
WorkTechnical 1
->
Water groundwater

## Tags

food
water

# Habitats

## Construction

duration=4000

## Function

Name: Basic needs
Active: always

Water 2
FoodRaw 5
FoodProcessed 3
EnergyElectric 4
->
Sewage 6

## Function

Active: always

HealthPhysical 3
->
Hapiness 1

## Function

Active: always

HealthMental 3
->
Hapiness 1

## Function

Active: always

HealthSocial 3
->
Hapiness 1

## Function

Active: always

Childcare 2
->
Hapiness 1

## Function

Name: Maintainers
Pool: true

EducationGeneral 2
EducationTechnical 1
->
WorkMaintenance 6

## Function

Name: Technicians
Pool: true

EducationGeneral 2
EducationTechnical 2
EducationMathematical 1
->
WorkTechnical 6

## Function

Name: Administrators
Pool: true

EducationGeneral 2
EducationSocial 1
EducationMathematical 1
->
WorkAdministrative 6

## Function

Name: Engineers
Pool: true

EducationGeneral 3
EducationTechnical 4
EducationMathematical 2
-> 
WorkEngineering 6

## Function

Name: Educators
Pool: true

EducationGeneral 3
EducationMathematical 2
EducationSocial 4
->
WorkEducational 6

## Function

Name: Scientists
Pool: true

EducationGeneral 4
EducationMathematical 4
EducationTechnical 3
->
WorkScientific 6

## Tags

people

## Properties

poolSize=6

# Library

## Function

EnergyElectric 1
WorkEducational 1
WorkAdministrative 1
->
HealthMental 6

## Tags

people

# Agriplot

## Construction

duration=2000

## Function

Water 4
Fertilizer 2
EnergyElectric 1
WorkTechnical 2
->
FoodRaw soil
WasteBio soil/3

## Tags

food
water

# Extractor

## Construction

duration=1900

## Function

Name: Metals
Pool: true

EnergyElectric 5
WorkTechnical 5
WorkEngineering 1
->
OreMetal metals

## Function

Name: Minerals
Pool: true

EnergyElectric 3
WorkTechnical 3
WorkEngineering 1
->
OreMineral minerals

## Function

Name: Uranium
Pool: true

EnergyElectric 4
Water 3
WorkTechnical 2
WorkEngineering 1
->
OreUranium uranium

## Properties

showFloor=false
pollutionArea=3
poolSize=4

## Tags

industry

# WindLoop

## Function

WorkTechnical 1
->
EnergyElectric wind

## Tags

energy

# SunCatcher

## Function

WorkTechnical 1
->
EnergyElectric insolation

## Tags

energy

# Arena

## Function

EnergyElectric 10
WorkAdministrative 2
->
HealthSocial 20

## Tags

people

# Metal Smelter

## Function

WorkTechnical 3
EnergyElectric 10
Water 5
OreMetal 5
->
Metals 10

## Properties

pollutionArea=4

## Tags

industry

# Mineral Refinery

## Function

WorkTechnical 2
EnergyElectric 3
Water 2
OreMineral 5
->
Minerals 20

## Properties

pollutionArea=3

## Tags

industry

# Uranium Mill

## Function

WorkTechnical 6
EnergyElectric 5
Water 15
OreUranium 5
->
Uranium 6

## Tags

industry

# TownSquare

## Function

WorkMaintenance 2
EnergyElectric 1
Water 2
->
HealthSocial 8 pollution

## Tags

people

# Park

## Function

Water 3
WorkMaintenance 2
->
HealthPhysical 1 pollution
HealthMental 1 pollution
HealthSocial 3 pollution

## Tags

people

## Construction

duration=2000

# Fertilizatron

## Construction

duration=1500

## Function

Chemicals 4
EnergyElectric 2
WorkTechnical 1
WorkEngineering 1
->
Fertilizer 12

## Properties

pollutionArea=1

## Tags

food
industry

# ChildKeep

## Construction

duration=1800

## Function

Water 5
FoodRaw 3
FoodProcessed 2
EnergyElectric 4
WorkEducational 4
WorkMaintenance 1
->
Childcare 10 pollution
Sewage 6

## Tags

people

# WaterTreatment

## Function

Sewage 20
EnergyElectric 8
WorkTechnical 2
->
Water 10

## Tags

water

# Fission Plant

## Function

Uranium 5
WorkTechnical 4
WorkEngineering 2
Water 2
->
EnergyElectric 20
WasteNuclear 2

## Tags

energy

# Nuclear Waste Depot

## Function

WasteNuclear 6
WorkMaintenance 5
WorkTechnical 1
EnergyElectric 1
->

## Tags

energy

# Gymnasium

## Function

EnergyElectric 3
Water 6
WorkMaintenance 4
WorkAdministrative 1
->
HealthSocial 4
HealthPhysical 8

## Tags

people

# FoodProcessor

## Function

EnergyElectric 10
WorkTechnical 1
Water 8
FoodRaw 18
->
FoodProcessed 12
WasteBio 8

## Tags

food

# FloaterTower

## Function

EnergyElectric 6
WorkAdministrative 2
WorkTechnical 1
WorkMaintenance 3
->
ImportExport 50

## Properties

randomizedDelayAnimationStart=20

## Tags

transport


# School

## Function

WorkEducational 3
EnergyElectric 4
Water 4
WorkMaintenance 1
->
EducationGeneral 10
Sewage 2

## Tags

education

# Academy

## Function

Name: Social
Pool: true

WorkEducational 3
EnergyElectric 4
Water 2
WorkMaintenance 1
->
EducationSocial 10
Sewage 1

## Function

Name: Math
Pool: true

WorkEducational 3
EnergyElectrical 2
Water 2
WorkMaintenance 1
->
EducationMathematical 10
Sewage 1

## Function

Name: Technical
Pool: true

EnergyElectric 2
Water 2
WorkEducational 3
WorkMaintenance 1
->
EducationTechnical 10
Sewage 1

## Tags

education

## Properties

poolSize=8

# BioFurnace

## Function

WasteBio 10
WorkMaintenance 1
WorkTechnical 3
WorkEngineering 2
->
EnergyElectric 20

## Properties

pollutionArea=3

## Tags

energy
