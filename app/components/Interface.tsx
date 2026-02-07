import { useEffect, useRef } from 'react'
import { addEffect } from '@react-three/fiber'
import { useSelectionStore } from '../stores/useSelectionStore'

export default function Interface()
{
    const { selectedCount, totalCount, selectionTime } = useSelectionStore()
    const unselectedCount = totalCount - selectedCount

    return <div className="interface fixed inset-0 w-full h-full font-sans font-normal pointer-events-none">
        <div className="absolute top-10 left-10 flex flex-col gap-2 pointer-events-auto">
            <div className="text-white bg-black/50 px-3 py-1.5 rounded">
                按住Shift键并拖拽绘制套索来框选点
            </div>
            {totalCount > 0 && (
                <div className="text-white bg-black/50 px-3 py-1.5 rounded text-sm space-y-1">
                    <div>已选点数: {selectedCount.toLocaleString()}</div>
                    <div>未选点数: {unselectedCount.toLocaleString()}</div>
                    <div>总点数: {totalCount.toLocaleString()}</div>
                    <div>计算耗时: {selectionTime.toFixed(2)} ms</div>
                </div>
            )}
        </div>
    </div>
 }
