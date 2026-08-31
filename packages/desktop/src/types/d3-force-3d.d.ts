declare module 'd3-force-3d' {
  export function forceSimulation<Node extends { x?: number; y?: number; z?: number; vx?: number; vy?: number; vz?: number }>(
    nodes?: Node[]
  ): Simulation<Node>;

  export function forceLink<Node extends { id?: string; x?: number; y?: number; z?: number }, Link extends { source: string | Node; target: string | Node; distance?: number }>(
    links?: Link[]
  ): ForceLink<Node, Link>;

  export function forceManyBody<Node>(): ForceManyBody<Node>;
  export function forceCenter<Node>(x?: number, y?: number, z?: number): ForceCenter<Node>;
  export function forceCollide<Node>(radius?: number | ((node: Node) => number)): any;
  export function forceX<Node>(x?: number): any;
  export function forceY<Node>(y?: number): any;
  export function forceZ<Node>(z?: number): any;

  export interface Simulation<Node> {
    nodes(nodes: Node[]): this;
    nodes(): Node[];
    force(name: string, force?: unknown): this;
    force(name: string): unknown;
    alpha(alpha: number): this;
    alpha(): number;
    alphaMin(alphaMin: number): this;
    alphaDecay(alphaDecay: number): this;
    velocityDecay(velocityDecay: number): this;
    stop(): this;
    restart(): this;
    tick(iterations?: number): this;
    on(typenames: string, listener?: (this: this) => void): this;
  }

  export interface ForceLink<Node, Link> {
    id(accessor: (node: Node) => string): this;
    links(links: Link[]): this;
    distance(distance: number | ((link: Link) => number)): this;
    strength(strength: number | ((link: Link) => number)): this;
  }

  export interface ForceManyBody<Node> {
    strength(strength: number | ((node: Node) => number)): this;
    distanceMax(distance: number): this;
    distanceMin(distance: number): this;
  }

  export interface ForceCenter<Node> {
    x(x: number): this;
    y(y: number): this;
    z(z: number): this;
    strength(strength: number): this;
  }
}
