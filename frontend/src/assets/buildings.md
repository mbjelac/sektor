# Destroy

# WaterWells

## Construction

duration=2000
size=1

## Function

EnergyElectric 3
WorkTechnical 1
->
Water groundwater

## Tags

water

# Habitats

## Construction

duration=4000
size=2

## Function

Name: Basic needs

Water 2
FoodRaw 5
FoodProcessed 3
EnergyElectric 4
->
Sewage 6

## Function

HealthPhysical 3
->
Hapiness 1

## Function

HealthMental 3
->
Hapiness 1

## Function

HealthSocial 3
->
Hapiness 1

## Function

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

## Construction

size=1

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

duration=2200
size=1

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

# Extractor

## Construction

duration=1900
size=2

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

mining

# WindLoop

## Construction

size=2

## Function

WorkTechnical 1
->
EnergyElectric wind

## Tags

energy

# SunCatcher

## Construction

size=2

## Function

WorkTechnical 1
->
EnergyElectric insolation

## Tags

energy

# Arena

## Construction

size=2

## Function

EnergyElectric 10
WorkAdministrative 2
->
HealthSocial 20

## Tags

people

# Metal Smelter

## Construction

size=3

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

mining

# Mineral Refinery

## Construction

size=3

## Function

Name: Basic operations

WorkTechnical 2
EnergyElectric 3
->

## Function

Name: Minerals
Pool: true

EnergyElectric 1
Water 1
OreMineral 1
WorkMaintenance 1
->
Minerals 2

## Function

Name: Silica
Pool: true

EnergyElectric 1
Water 1
OreMineral 1
WorkMaintenance 1
->
Silica 2

## Function

Name: Clay
Pool: true

EnergyElectric 1
Water 1
OreMineral 1
WorkMaintenance 1
->
Clay 2

## Properties

poolSize=9
pollutionArea=3

## Tags

mining

# Uranium Mill

## Construction

size=2

## Function

WorkTechnical 6
EnergyElectric 5
Water 15
OreUranium 5
->
Uranium 6

## Tags

mining

# TownSquare

## Construction

size=1

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
size=0

# Fertilizatron

## Construction

duration=1500
size=1

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
size=1

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

education

# WaterTreatment

## Construction

size=2

## Function

Sewage 20
EnergyElectric 8
WorkTechnical 2
->
Water 10

## Tags

water
industry

# CoreSplitter

## Construction

duration=3200
size=3

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

## Construction

size=3

## Function

WasteNuclear 6
WorkMaintenance 5
WorkTechnical 1
EnergyElectric 1
->

## Tags

energy

# Gymnasium

## Construction

duration=3100
size=1

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

## Construction

duration=3300
size=2

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

## Properties

pollutionArea=1

# SkyTower

## Construction

size=2

## Function

EnergyElectric 4
WorkAdministrative 2
WorkMaintenance 2
->
ImportExport 50

## Properties

randomizedDelayAnimationStart=20

## Tags

transport


# School

## Construction

size=2

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

## Construction

duration=2700
size=2

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
EnergyElectric 2
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

## Construction

size=3

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


# MineralFurnace

## Construction

duration=3200
size=3

## Function

Name: Basic operations

EnergyElectric 4
WorkTechnical 3
WorkEngineering 1
->

## Function

Name: Glass
Pool: true

Silica 1
EnergyElectric 1
WorkMaintenance 1
->
Glass 1

## Function

Name: Ceramics
Pool: true

Clay 1
EnergyElectric 1 
WorkMaintenance 1
->
Ceramics 1

## Properties

poolSize=8

## Tags

industry

# BioReactor

## Construction

size=2

## Function

WasteBio 3
Water 3
EnergyElectric 1
WorkTechnical 1
->
Polymers 5

## Tags

industry

# Metalurgy

## Function

Metals 5
Minerals 2
EnergyElectric 9
WorkTechnical 1
->
StructuralAlloys 5

## Construction

size=2

## Tags

industry

# Composter

## Construction

duration=2200
size=1

## Function

WasteBio 5
EnergyElectric 1
WorkTechnical 1
->
Fertilizer 5

## Tags

food
industry
