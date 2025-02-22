import { icon, sh } from "lib/utils"
import icons from "lib/icons"
import Progress from "./Progress"
import brightness from "service/brightness"
import options from "options"
import Battery_state from "./charging_mode"

const audio = await Service.import("audio")
const { progress, microphone,speaker,eyecare,charging_mode } = options.osd

const { eyecare:eyecarestate } = options.theme
const {charging_mode:charging_mode_state} = options.theme

const DELAY = 2500

function OnScreenProgress(vertical: boolean) {
    const indicator = Widget.Icon({
        size: 42,
        vpack: "start",
    })
    const progress = Progress({
        vertical,
        width: vertical ? 42 : 300,
        height: vertical ? 300 : 42,
        child: indicator,
    })

    const revealer = Widget.Revealer({
        transition: "slide_left",
        child: progress,
    })

    let count = 0
    function show(value: number, icon: string) {
        revealer.reveal_child = true
        indicator.icon = icon
        progress.setValue(value)
        count++
        Utils.timeout(DELAY, () => {
            count--

            if (count === 0)
                revealer.reveal_child = false
        })
    }

    return revealer
        .hook(brightness, () => show(
            brightness.screen,
            icons.brightness.screen,
        ), "notify::screen")
        .hook(brightness, () => show(
            brightness.kbd,
            icons.brightness.keyboard,
        ), "notify::kbd")
        .hook(audio.speaker, () => show(
            audio.speaker.volume,
            icon(audio.speaker.icon_name || "", icons.audio.type.speaker),
        ), "notify::volume")
}

function Mute(){
    const icon = Widget.Icon({
        class_name: "speaker",
    })

    const revealer = Widget.Revealer({
        transition: "slide_up",
        child: icon,
    })

    let count = 0
    let mute = audio.speaker.stream?.is_muted?? false

    return revealer.hook(audio.speaker, () => Utils.idle(() => {
        if (mute!== audio.speaker.stream?.is_muted) {
            mute = audio.speaker.stream!.is_muted
            icon.icon = icons.audio.volume[mute? "muted" : "high"]
            revealer.reveal_child = true
            count++

            Utils.timeout(DELAY, () => {
                count--
                if (count === 0)
                    revealer.reveal_child = false
            })
        }
    }))
}


function MicrophoneMute() {
    const icon = Widget.Icon({
        class_name: "microphone",
    })

    const revealer = Widget.Revealer({
        transition: "slide_up",
        child: icon,
    })

    let count = 0
    let mute = audio.microphone.stream?.is_muted ?? false

    return revealer.hook(audio.microphone, () => Utils.idle(() => {
        if (mute !== audio.microphone.stream?.is_muted) {
            mute = audio.microphone.stream!.is_muted
            icon.icon = icons.audio.mic[mute ? "muted" : "high"]
            revealer.reveal_child = true
            count++

            Utils.timeout(DELAY, () => {
                count--
                if (count === 0)
                    revealer.reveal_child = false
            })
        }
    }))
}

function Eyecare(){
    const icon = Widget.Icon({
        class_name: "eye-care",
    })

    const revealer = Widget.Revealer({
        transition: "slide_up",
        child: icon,
    })

    let count = 0;
    // let widgetEyecare_state = eyecarestate.value == "normal" ? "normal":"eyecare" ;
    

    return revealer.hook(eyecarestate, () => Utils.idle(() => {
        // sh("notify-send widgetEyecare_state")
        icon.icon = icons.custom[eyecarestate.value === "eyecare"?"eyecare":"normal"]
        revealer.reveal_child = true
        count++

        Utils.timeout(DELAY, () => {
            count--
            if (count === 0)
                revealer.reveal_child = false
        })
        
    }))
}

// function Battery_state() {
//     const icon = Widget.Icon({
//         class_name: "charging_mode", // Ensure this class is styled appropriately
//     });

//     const revealer = Widget.Revealer({
//         transition: "crossfade",
//         child: icon,
//     });

//     let count = 0;

//     function updateChargingMode() {
//         sh("notify-send 'Battery_state updated'"); // Debugging notification
//         icon.icon = icons.battery[charging_mode_state.value === "charging" ? "charging" : "unplugged"];
//         revealer.reveal_child = true;

//         count++;
//         Utils.timeout(DELAY, () => {
//             count--;
//             if (count === 0)
//                 revealer.reveal_child = false;
//         });
//     }

//     // Initial update
//     updateChargingMode();

//     // Connect to changes in charging_mode_state
//     charging_mode_state.connect('notify::value', updateChargingMode);

//     return revealer;
// }



export default (monitor: number) => Widget.Window({
    monitor,
    name: `indicator${monitor}`,
    class_name: "indicator",
    layer: "overlay",
    click_through: true,
    anchor: ["right", "left", "top", "bottom"],
    child: Widget.Box({
        css: "padding: 2px;",
        expand: true,
        child: Widget.Overlay(
            { child: Widget.Box({ expand: true }) },
            Widget.Box({
                hpack: progress.pack.h.bind(),
                vpack: progress.pack.v.bind(),
                child: progress.vertical.bind().as(OnScreenProgress),
            }),
            Widget.Box({
                hpack: microphone.pack.h.bind(),
                vpack: microphone.pack.v.bind(),
                child: MicrophoneMute(),
            }),
            Widget.Box({
                hpack: speaker.pack.h.bind(),
                vpack: speaker.pack.v.bind(),
                child: Mute(),
            }),
            Widget.Box({
                hpack: eyecare.pack.h.bind(),
                vpack: eyecare.pack.v.bind(),
                child: Eyecare(),
            }),
            Widget.Box({
                hpack: charging_mode.pack.h.bind(),
                vpack: charging_mode.pack.v.bind(),
                child: Battery_state(),
            }),

        ),
    }),
})
