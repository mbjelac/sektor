# Destroy

## Render

```
pri4 s(30,20,12) t(0,0,10) c(#f0a41c)
pri4 s(6,20,14) t(-10,0,18) r(0,0,90) c(#c70000)
```

# TestFactory

## Render

```
pri4 s(30,30,30) t(0,0,0) c(#4488cc)
```

## Function

Water 3
Energy 1
->
Food soil

## Properties

tags=food,water

# TestMine

## Render

```
cyl s(20,20,20) t(0,0,0) c(#cc8844)
```

## Function

Energy 4
->
Ore ore

## Properties

showFloor=false
tags=food,industry

# TestHouse

## Render

```
pri4 s(20,20,25) t(0,0,0) c(#eedd88)
pri4 s(15,15,15) t(0,0,10) r(90,45,90) c(#eedd88)
```

## Function

Name: Living
Food 2
Water 1
->
Work 3

## Properties

tags=food

# TestProcessor

## Render

```
pri4 s(22,22,22) t(0,0,0) c(#66cc66)
```

## Function

Food 2
->
Wood 3

## Properties

tags=food

# TestRefinery

## Render

```
pri4 s(25,25,35) t(0,0,0) c(#aa5533)
```

## Function

Ore 5
Water 4
Energy 3
Wood 2
Stone 1
->
Metal 6
Fuel 3

## Properties

tags=food

# TestWorkshop

## Render

```
pri4 s(24,24,18) t(0,0,0) c(#9977cc)
```

## Function

Name: Tool making
Ore 4
->
Metal ore

## Function

Name: Cart making
Wood 3
->
Fuel wind

## Properties

tags=food

# TestClinic

## Render

```
pri4 s(26,26,16) t(0,0,0) c(#dd6688)
```

## Function

Care 2
->
Work 4

## Properties

tags=food

# TestCarer

## Render

```
pri4 s(22,22,20) t(0,0,0) c(#66aacc)
```

## Function

Food 1
->
Care 4

## Properties

tags=food

# TestReactor

## Render

```
pri4 s(24,24,22) t(0,0,0) c(#55bb88)
```

## Function

Name: Power making
Water 2
->
Energy 5

## Function

Name: Cooling
Active: always
Energy 1
->
Water 1

## Properties

tags=food

# TestTower

## Render

```
pri4 s(18,18,40) t(0,0,0) c(#bb9944)
```

## Function

Energy 2
->
Work 1

## Properties

minLevel=5
tags=food

# TestHabitat

## Render

```
pri4 s(24,24,28) t(0,0,0) c(#ffd1f4)
pri4 s(18,18,14) t(0,0,14) r(90,45,90) c(#e8a9d5)
```

## Function

Name: Living well

Care 2
->
Hapiness 5

## Properties

tags=food

# TestSmokestack

## Render

```
cyl s(8,8,40) t(0,0,0) c(#555555)
```

## Function

Energy 2
->
Fuel 1

## Properties

tags=industry
pollutionArea=2
