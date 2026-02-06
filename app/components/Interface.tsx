import { useEffect, useRef } from 'react'
import { addEffect } from '@react-three/fiber'


export default function Interface()
{
    return <div className="interface fixed inset-0 w-full h-full font-sans font-normal pointer-events-none">
        <div className="absolute top-10 left-10 text-white bg-black/50 px-3 py-1.5 rounded pointer-events-auto">
          按住Shift键并拖拽来框选点
        </div>
    </div>
 }
