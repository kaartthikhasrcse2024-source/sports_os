declare module 'react-leaflet-cluster' {
    import * as React from 'react';

    export interface MarkerClusterGroupProps {
        chunkedLoading?: boolean;
        polygonOptions?: any;
        children?: React.ReactNode;
        [key: string]: any;
    }

    export default class MarkerClusterGroup extends React.Component<MarkerClusterGroupProps, any> { }
}
