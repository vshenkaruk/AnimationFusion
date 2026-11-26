-- Run once in Roblox Studio's Command Bar while editing the local Place1 test place.
-- Creates a reusable, editable town-race set and three block avatars.
local Workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")
local old = Workspace:FindFirstChild("SecondPlacePrototype")
if old then old:Destroy() end

local root = Instance.new("Folder")
root.Name = "SecondPlacePrototype"
root.Parent = Workspace

Lighting.ClockTime = 14.5
Lighting.Brightness = 2.1
Lighting.Ambient = Color3.fromRGB(115, 125, 145)
Lighting.OutdoorAmbient = Color3.fromRGB(160, 170, 185)
Lighting.EnvironmentDiffuseScale = 0.7
Lighting.EnvironmentSpecularScale = 0.45

local function part(parent, name, size, cf, color, material, anchored)
    local p = Instance.new("Part")
    p.Name = name
    p.Size = size
    p.CFrame = cf
    p.Color = color
    p.Material = material or Enum.Material.SmoothPlastic
    p.Anchored = anchored ~= false
    p.TopSurface = Enum.SurfaceType.Smooth
    p.BottomSurface = Enum.SurfaceType.Smooth
    p.Parent = parent
    return p
end

-- Main road, sidewalks, lane markings, start and finish marks.
part(root, "TownRoad", Vector3.new(42, 1, 250), CFrame.new(0, -0.5, -82), Color3.fromRGB(49, 53, 61), Enum.Material.Asphalt)
part(root, "LeftSidewalk", Vector3.new(11, 1.2, 250), CFrame.new(-26.5, -0.2, -82), Color3.fromRGB(175, 177, 170), Enum.Material.Concrete)
part(root, "RightSidewalk", Vector3.new(11, 1.2, 250), CFrame.new(26.5, -0.2, -82), Color3.fromRGB(175, 177, 170), Enum.Material.Concrete)
for z = -194, 35, 18 do
    part(root, "CenterLine", Vector3.new(0.45, 0.08, 8), CFrame.new(0, 0.06, z), Color3.fromRGB(250, 211, 80), Enum.Material.Neon)
end
for i = -4, 4 do
    part(root, "StartGrid", Vector3.new(4.2, 0.09, 0.45), CFrame.new(i * 4.4, 0.08, 4), Color3.fromRGB(242, 242, 235), Enum.Material.Neon)
    part(root, "FinishStripe", Vector3.new(4.2, 0.09, 0.45), CFrame.new(i * 4.4, 0.08, -153), i % 2 == 0 and Color3.fromRGB(245,245,245) or Color3.fromRGB(22,22,25), Enum.Material.Neon)
end

-- Colorful town storefronts create the same simple, readable Roblox street backdrop.
local shopColors = {
    Color3.fromRGB(218, 138, 88), Color3.fromRGB(91, 154, 180),
    Color3.fromRGB(220, 190, 116), Color3.fromRGB(125, 170, 127),
    Color3.fromRGB(191, 127, 150), Color3.fromRGB(130, 145, 190),
}
for side = -1, 1, 2 do
    for i = 1, 8 do
        local z = 22 - i * 27
        local x = side * 34
        local facade = part(root, "Storefront_" .. side .. "_" .. i,
            Vector3.new(17, 22 + (i % 3) * 3, 22),
            CFrame.new(x, 10.5 + (i % 3) * 1.5, z), shopColors[(i + (side == 1 and 2 or 0) - 1) % #shopColors + 1], Enum.Material.SmoothPlastic)
        part(root, "Roof_" .. side .. "_" .. i, Vector3.new(18, 1.1, 23), facade.CFrame * CFrame.new(0, facade.Size.Y/2 + 0.55, 0), Color3.fromRGB(42, 47, 57), Enum.Material.Slate)
        part(root, "ShopWindow_" .. side .. "_" .. i, Vector3.new(0.18, 7, 8), CFrame.new(x - side*8.6, 5, z - 2), Color3.fromRGB(90, 178, 205), Enum.Material.Glass)
        part(root, "ShopDoor_" .. side .. "_" .. i, Vector3.new(0.2, 8, 4), CFrame.new(x - side*8.62, 4.5, z + 6), Color3.fromRGB(88, 61, 49), Enum.Material.Wood)
        part(root, "Awning_" .. side .. "_" .. i, Vector3.new(2.5, 1, 10), CFrame.new(x - side*10, 10, z), i % 2 == 0 and Color3.fromRGB(226, 72, 61) or Color3.fromRGB(47, 119, 181), Enum.Material.Fabric)
    end
end

-- Street furniture and trees, placed away from the camera path.
for z = -182, 8, 38 do
    for _, side in ipairs({-1, 1}) do
        local x = side * 31
        part(root, "LampPost", Vector3.new(0.45, 10, 0.45), CFrame.new(x, 5, z), Color3.fromRGB(48, 50, 55), Enum.Material.Metal)
        part(root, "LampArm", Vector3.new(3, 0.35, 0.35), CFrame.new(x - side*1.25, 9.5, z), Color3.fromRGB(48, 50, 55), Enum.Material.Metal)
        local lamp = part(root, "Lamp", Vector3.new(1.25, 0.45, 1.25), CFrame.new(x - side*2.4, 9.35, z), Color3.fromRGB(255, 231, 171), Enum.Material.Neon)
        local glow = Instance.new("PointLight"); glow.Color = lamp.Color; glow.Brightness = 0.35; glow.Range = 14; glow.Parent = lamp
    end
end

local function makeFace(head, expression)
    local gui = Instance.new("SurfaceGui")
    gui.Name = "Face"
    gui.Face = Enum.NormalId.Front
    gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
    gui.PixelsPerStud = 55
    gui.Parent = head
    local label = Instance.new("TextLabel")
    label.BackgroundTransparency = 1
    label.Size = UDim2.fromScale(1, 1)
    label.Font = Enum.Font.GothamBold
    label.TextScaled = true
    label.TextColor3 = Color3.fromRGB(28, 25, 32)
    label.TextStrokeTransparency = 1
    label.Text = expression
    label.Parent = gui
end

local function makeRunner(name, outfit, pants, gauge, expression, startX, startZ)
    local model = Instance.new("Model")
    model.Name = name
    model.Parent = root
    local base = CFrame.new(startX, 0, startZ)
    local torso = part(model, "Torso", Vector3.new(2.3, 2.5, 1.2), base * CFrame.new(0, 3.1, 0), outfit)
    model.PrimaryPart = torso
    part(model, "Head", Vector3.new(2, 2, 2), base * CFrame.new(0, 5.35, 0), Color3.fromRGB(242, 195, 153))
    makeFace(model.Head, expression)
    part(model, "LeftArm", Vector3.new(0.85, 2.4, 0.9), base * CFrame.new(-1.55, 3.1, 0), outfit)
    part(model, "RightArm", Vector3.new(0.85, 2.4, 0.9), base * CFrame.new(1.55, 3.1, 0), outfit)
    part(model, "LeftLeg", Vector3.new(1, 2.3, 1), base * CFrame.new(-0.62, 0.95, 0), pants)
    part(model, "RightLeg", Vector3.new(1, 2.3, 1), base * CFrame.new(0.62, 0.95, 0), pants)
    local badge = Instance.new("BillboardGui")
    badge.Name = "SpeedGauge"
    badge.Adornee = torso
    badge.Size = UDim2.fromOffset(92, 92)
    badge.StudsOffset = Vector3.new(0, -0.15, -0.82)
    badge.AlwaysOnTop = true
    badge.Parent = torso
    local ring = Instance.new("Frame")
    ring.Name = "Ring"
    ring.Size = UDim2.fromScale(1, 1)
    ring.BackgroundColor3 = Color3.fromRGB(15, 20, 29)
    ring.BackgroundTransparency = 0.04
    ring.Parent = badge
    Instance.new("UICorner", ring).CornerRadius = UDim.new(1, 0)
    local stroke = Instance.new("UIStroke", ring)
    stroke.Thickness = 5
    stroke.Color = gauge
    stroke.Transparency = 0.05
    local speed = Instance.new("TextLabel")
    speed.Name = "Value"
    speed.BackgroundTransparency = 1
    speed.Size = UDim2.fromScale(1, 1)
    speed.Font = Enum.Font.GothamBlack
    speed.TextScaled = true
    speed.TextColor3 = gauge
    speed.Text = "00"
    speed.Parent = ring
    return model
end

local teal = Color3.fromRGB(62, 188, 174)
local pink = Color3.fromRGB(235, 91, 173)
local navy = Color3.fromRGB(31, 45, 119)
local orange = Color3.fromRGB(255, 94, 42)
local blue = Color3.fromRGB(60, 189, 255)
makeRunner("Milo", Color3.fromRGB(232, 238, 240), teal, blue, "•  •\n⌣", -5, 4)
makeRunner("Nia", pink, Color3.fromRGB(35, 42, 65), blue, "⌒  ⌒\n⌣", 0, 4)
makeRunner("Dash", navy, Color3.fromRGB(190, 45, 47), orange, "•  •\n⌣", 5, 4)

-- A bold, readable start arch and speed pickups in the distance.
part(root, "StartArchLeft", Vector3.new(1, 11, 1), CFrame.new(-10, 5.5, 10), Color3.fromRGB(244, 78, 53), Enum.Material.Neon)
part(root, "StartArchRight", Vector3.new(1, 11, 1), CFrame.new(10, 5.5, 10), Color3.fromRGB(244, 78, 53), Enum.Material.Neon)
part(root, "StartArchTop", Vector3.new(21, 1, 1), CFrame.new(0, 11, 10), Color3.fromRGB(244, 78, 53), Enum.Material.Neon)
for i = 1, 4 do
    local token = part(root, "SpeedToken_" .. i, Vector3.new(3.2, 3.2, 0.6), CFrame.new(((i % 2) * 2 - 1) * 5, 3.5, -18 - i*22), i % 2 == 0 and blue or orange, Enum.Material.Neon)
    token.Shape = Enum.PartType.Cylinder
    token.CFrame = token.CFrame * CFrame.Angles(0, 0, math.rad(90))
end

print("SecondPlacePrototype created. Add the Cinematic.client.lua file to StarterPlayerScripts, then Play.")
