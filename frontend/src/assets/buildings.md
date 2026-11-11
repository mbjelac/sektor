# Destroy

# WaterWells

## Construction

duration=2000

StructuralAlloys 1
Electronics 1
Regolith 4
Polymers 2
Machinery 2

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

Glass 4
StructuralAlloys 5
Electronics 3
Regolith 4
Ceramics 2
Composites 2
Polymers 2

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

## Construction

Glass 6
StructuralAlloys 4
Electronics 2
Polymers 1

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

Glass 3
StructuralAlloys 1
Electronics 2
Polymers 2
Machinery 1
Robotics 2

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

StructuralAlloys 10
Electronics 3
Ceramics 2
Composites 2
Machinery 4
Robotics 1

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

## Construction

StructuralAlloys 5
Electronics 6
Composites 4

## Function

WorkTechnical 1
->
EnergyElectric wind

## Tags

energy

# SunCatcher

## Construction

Glass 4
StructuralAlloys 3
Electronics 8
Ceramics 2
Composites 1

## Function

WorkTechnical 1
->
EnergyElectric insolation

## Tags

energy

# Arena

## Construction

Glass 2
StructuralAlloys 4
Electronics 3
Regolith 1
Polymers 1

## Function

EnergyElectric 10
WorkAdministrative 2
->
HealthSocial 20

## Tags

people

# Metal Smelter

## Construction

StructuralAlloys 6
Electronics 2
Regolith 4
Ceramics 6
Machinery 4
Robotics 1

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

## Construction

Glass 1
StructuralAlloys 6
Electronics 4
Regolith 4
Ceramics 6
Machinery 3
Robotics 1

## Function

Name: System core

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

industry

# Uranium Mill

## Construction

Glass 1
StructuralAlloys 7
Electronics 4
Regolith 1
Ceramics 3
Composites 4
Polymers 3
Machinery 1

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

## Construction

StructuralAlloys 1
Electronics 1
Regolith 4
Ceramics 1
Polymers 1

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

StructuralAlloys 3
Electronics 2
Regolith 1
Machinery 1
Robotics 1

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

Glass 4
StructuralAlloys 3
Electronics 3
Regolith 2
Polymers 1
Robotics 1

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

StructuralAlloys 3
Electronics 2
Regolith 2
Ceramics 1
Composites 1
Polymers 1
Machinery 1

## Function

Sewage 20
EnergyElectric 8
WorkTechnical 2
->
Water 10

## Tags

water

# CoreSplitter

## Construction

duration=3200

Glass 1
StructuralAlloys 8
Electronics 4
Regolith 10
Ceramics 6
Composites 2
Polymers 2
Machinery 1
Robotics 1

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

StructuralAlloys 6
Electronics 1
Regolith 10
Composites 1

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

Glass 8
StructuralAlloys 4
Electronics 1
Regolith 1

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

Glass 1
StructuralAlloys 6
Electronics 4
Regolith 2
Ceramics 1
Polymers 1
Machinery 1
Robotics 2

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

Glass 6
StructuralAlloys 8
Electronics 4
Regolith 4
Machinery 1
Robotics 3

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

Glass 4
StructuralAlloys 4
Electronics 4
Regolith 2
Polymers 1
Robotics 1

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

Glass 6
StructuralAlloys 5
Electronics 5
Regolith 3
Polymers 1
Robotics 1

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

StructuralAlloys 6
Electronics 3
Regolith 3
Ceramics 3
Machinery 2

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

Glass 1
StructuralAlloys 5
Electronics 2
Regolith 3
Ceramics 6
Machinery 2
Robotics 1

## Function

Name: System core

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

Glass 2
StructuralAlloys 2
Electronics 4
Regolith 1
Composites 2
Polymers 2
Machinery 1
Robotics 2

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

## Tags

industry
