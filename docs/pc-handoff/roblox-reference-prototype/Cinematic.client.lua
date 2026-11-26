-- Put this LocalScript in StarterPlayer > StarterPlayerScripts, then press Play.
-- A 22-second vertical-cinematic study: race lineup, gauge close-up, pursuit, speedster pass.
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")
local player = Players.LocalPlayer
local camera = Workspace.CurrentCamera
local scene = Workspace:WaitForChild("SecondPlacePrototype")
local milo = scene:WaitForChild("Milo")
local nia = scene:WaitForChild("Nia")
local dash = scene:WaitForChild("Dash")

local actors = {milo, nia, dash}
local bases = {}
for _, actor in ipairs(actors) do
    local pivot = actor:GetPivot()
    bases[actor] = {pivot = pivot, parts = {}}
    for _, obj in ipairs(actor:GetDescendants()) do
        if obj:IsA("BasePart") then
            bases[actor].parts[obj] = pivot:ToObjectSpace(obj.CFrame)
        end
    end
end

local gui = Instance.new("ScreenGui")
gui.Name = "ShortCaptions"
gui.IgnoreGuiInset = true
gui.ResetOnSpawn = false
gui.Parent = player:WaitForChild("PlayerGui")
local caption = Instance.new("TextLabel")
caption.Name = "Caption"
caption.AnchorPoint = Vector2.new(0.5, 1)
caption.Position = UDim2.fromScale(0.5, 0.88)
caption.Size = UDim2.fromScale(0.9, 0.13)
caption.BackgroundTransparency = 1
caption.Font = Enum.Font.GothamBlack
caption.TextColor3 = Color3.new(1, 1, 1)
caption.TextStrokeColor3 = Color3.new(0, 0, 0)
caption.TextStrokeTransparency = 0.05
caption.TextScaled = true
caption.TextWrapped = true
caption.Parent = gui

local timer = Instance.new("TextLabel")
timer.AnchorPoint = Vector2.new(0.5, 0)
timer.Position = UDim2.fromScale(0.5, 0.055)
timer.Size = UDim2.fromScale(0.32, 0.065)
timer.BackgroundColor3 = Color3.fromRGB(12, 17, 29)
timer.BackgroundTransparency = 0.12
timer.Font = Enum.Font.GothamBlack
timer.TextColor3 = Color3.fromRGB(255, 225, 112)
timer.TextScaled = true
timer.Text = "RACE  •  00"
timer.Parent = gui
Instance.new("UICorner", timer).CornerRadius = UDim.new(0.28, 0)
local timerStroke = Instance.new("UIStroke", timer)
timerStroke.Thickness = 3
timerStroke.Color = Color3.fromRGB(255, 115, 55)

local words = {
    {0.0, 2.1, "THREE RACERS. ONE SHOT."},
    {2.1, 4.0, "SECOND PLACE WINS."},
    {4.0, 6.2, "MILO'S WATCH STARTS AT ONE."},
    {6.2, 9.2, "NIA TAKES THE LEAD!"},
    {9.2, 12.3, "DASH IS RIGHT BEHIND."},
    {12.3, 15.0, "SPEED SIXTY!"},
    {15.0, 18.0, "HE'S CLOSING IN!"},
    {18.0, 20.0, "DON'T LOOK BACK!"},
    {20.0, 22.0, "SECOND PLACE..."},
}

local oldType = camera.CameraType
local character = player.Character or player.CharacterAdded:Wait()
local starterGui = game:GetService("StarterGui")
for _, obj in ipairs(character:GetDescendants()) do
    if obj:IsA("BasePart") then obj.LocalTransparencyModifier = 1 end
end
pcall(function()
    starterGui:SetCoreGuiEnabled(Enum.CoreGuiType.All, false)
    starterGui:SetCore("TopbarEnabled", false)
end)
local elapsed = 0
local connection
camera.CameraType = Enum.CameraType.Scriptable
camera.FieldOfView = 48

local function smooth(a, b, t)
    local x = math.clamp((t-a)/(b-a), 0, 1)
    return x*x*(3-2*x)
end
local function move(actor, cf, phase, amplitude)
    local b = bases[actor]
    local rootCF = cf
    actor:PivotTo(rootCF)
    local swing = math.sin(phase) * amplitude
    for p, localCF in pairs(b.parts) do
        local offset = CFrame.new()
        if p.Name == "LeftArm" then offset = CFrame.Angles(swing, 0, 0.18) end
        if p.Name == "RightArm" then offset = CFrame.Angles(-swing, 0, -0.18) end
        if p.Name == "LeftLeg" then offset = CFrame.Angles(-swing, 0, 0) end
        if p.Name == "RightLeg" then offset = CFrame.Angles(swing, 0, 0) end
        p.CFrame = rootCF * localCF * offset
    end
end
local function setGauge(actor, value)
    local gauge = actor:FindFirstChild("Torso") and actor.Torso:FindFirstChild("SpeedGauge")
    local label = gauge and gauge:FindFirstChild("Ring") and gauge.Ring:FindFirstChild("Value")
    if label then label.Text = string.format("%02d", value) end
end
local function trail(actor, color)
    local torso = actor:FindFirstChild("Torso")
    if not torso then return end
    local a0 = Instance.new("Attachment"); a0.Position = Vector3.new(0, 0, -0.8); a0.Parent = torso
    local a1 = Instance.new("Attachment"); a1.Position = Vector3.new(0, 0, 0.8); a1.Parent = torso
    local t = Instance.new("Trail")
    t.Attachment0 = a0; t.Attachment1 = a1; t.Lifetime = 0.42
    t.Color = ColorSequence.new(color, Color3.fromRGB(255, 235, 125))
    t.LightEmission = 0.9; t.FaceCamera = true; t.WidthScale = NumberSequence.new({NumberSequenceKeypoint.new(0, 1.35), NumberSequenceKeypoint.new(1, 0)})
    t.Parent = torso
end
trail(milo, Color3.fromRGB(59, 187, 255))
trail(dash, Color3.fromRGB(255, 72, 42))

local function cameraShot(t, from, lookAt, fov)
    local blend = smooth(t % 5.2, (t % 5.2) + 0.8, 0.55)
    camera.FieldOfView = fov or 48
    camera.CFrame = CFrame.lookAt(from, lookAt) * CFrame.new(0, 0, blend * 0.25)
end

connection = RunService.RenderStepped:Connect(function(dt)
    elapsed += dt
    local t = elapsed
    local run = math.clamp((t - 5.2) / 16.8, 0, 1)
    local distance = run * 150
    local phase = t * 12
    local start = CFrame.new
    move(milo, start(-5 + math.sin(t*0.8)*0.2, 3.1, 4 - distance*0.98), phase, t > 5 and 0.3 or 0.04)
    move(nia, start(0 + math.sin(t*0.8+1)*0.2, 3.1, 4 - distance*1.08), phase+1.2, t > 5 and 0.32 or 0.04)
    move(dash, start(5, 3.1, 4 - distance*1.16 + math.max(0, t-12)*5), phase+2.3, t > 5 and 0.35 or 0.04)
    setGauge(milo, math.floor(math.clamp(1 + t*3.2, 1, 61)))
    setGauge(nia, math.floor(math.clamp(3 + t*3.5, 3, 67)))
    setGauge(dash, math.floor(math.clamp(0 + t*4.2, 0, 88)))

    -- Cut between low establishing, gauge close-up, tracking and reverse chase angles.
    if t < 3.8 then
        cameraShot(t, Vector3.new(0, 4.1, 19), Vector3.new(0, 3.4, -5), 46)
    elseif t < 6.1 then
        cameraShot(t, Vector3.new(-6.5, 4.2, 11), Vector3.new(-5, 3.2, 1.7), 34)
    elseif t < 10.0 then
        cameraShot(t, Vector3.new(-3, 4.6, 11-distance*0.78), Vector3.new(0, 3.5, -15-distance), 51)
    elseif t < 13.1 then
        cameraShot(t, Vector3.new(3.5, 3.5, 10-distance), Vector3.new(5, 3.6, -10-distance), 37)
    elseif t < 17.2 then
        cameraShot(t, Vector3.new(11, 5, 14-distance*1.05), Vector3.new(4, 3.2, -13-distance*1.1), 48)
    elseif t < 19.5 then
        cameraShot(t, Vector3.new(-7, 5, -3-distance), Vector3.new(5, 4, -18-distance), 32)
    else
        cameraShot(t, Vector3.new(0, 15, 9-distance), Vector3.new(0, 1, -15-distance), 55)
    end

    caption.Text = ""
    for _, cue in ipairs(words) do
        if t >= cue[1] and t < cue[2] then caption.Text = cue[3]; break end
    end
    timer.Text = string.format("RACE  •  %02d", math.floor(math.max(0, t - 4)))
    if t >= 22 then
        connection:Disconnect()
        camera.CameraType = oldType
        for _, obj in ipairs(character:GetDescendants()) do
            if obj:IsA("BasePart") then obj.LocalTransparencyModifier = 0 end
        end
        pcall(function()
            starterGui:SetCoreGuiEnabled(Enum.CoreGuiType.All, true)
            starterGui:SetCore("TopbarEnabled", true)
        end)
        gui:Destroy()
    end
end)
