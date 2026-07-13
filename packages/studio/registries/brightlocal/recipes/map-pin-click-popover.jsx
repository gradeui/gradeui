// MapPinClickPopover — A click-activated popover on map grid pins using MapPopover + useMapPopoverClick. Always use List components (List, Item, ItemContent, ItemTitle, ItemSubheader) from @brightlocal/ui-components/list for popover content — do not use raw div elements.
// keywords: map popover, map pin click, map click, pin details, map info window, marker popover, advanced marker, popover anchor
// components: map, list
// Harvested from BrightLocal's DS MCP (get_composition_recipe "MapPinClickPopover") —
// hand-edit freely; re-running the harvester OVERWRITES this file.

import { AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import { MapGridPin, MapPopover, MapPopoverAnchor, MapPopoverContent, useMapPopoverClick } from "@brightlocal/ui-components/map";
import { Item, ItemContent, ItemSubheader, ItemTitle, List } from "@brightlocal/ui-components/list";

const { activeItem, anchorItem, showItem, close } = useMapPopoverClick<Pin>();

<Map onClick={close}>
  <MapPopover open={!!activeItem}>
    {pins.map((pin) => {
      const isAnchor = anchorItem?.id === pin.id;
      const gridPin = (
        <MapGridPin
          dataHook={`pin-${pin.id}`}
          value={pin.rank}
        />
      );
      return (
        <AdvancedMarker key={pin.id} position={pin.position} onClick={() => showItem(pin)}>
          {isAnchor ? <MapPopoverAnchor asChild>{gridPin}</MapPopoverAnchor> : gridPin}
        </AdvancedMarker>
      );
    })}
    <MapPopoverContent
      dataHook="grid-popover"
      onEscapeKeyDown={close}
    >
      {activeItem && (
        <List dataHook="popover-list">
          <ItemSubheader>Grid position</ItemSubheader>
          <Item variant="default" dataHook="popover-rank">
            <ItemContent>
              <ItemTitle>Rank: {activeItem.rank}</ItemTitle>
            </ItemContent>
          </Item>
        </List>
      )}
    </MapPopoverContent>
  </MapPopover>
</Map>
