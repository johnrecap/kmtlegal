import * as React from 'react';

import {
  Tabs as TabsPrimitive,
  TabsList as TabsListPrimitive,
  TabsTrigger as TabsTriggerPrimitive,
  TabsContent as TabsContentPrimitive,
  TabsContents as TabsContentsPrimitive,
  type TabsProps as TabsPrimitiveProps,
  type TabsListProps as TabsListPrimitiveProps,
  type TabsTriggerProps as TabsTriggerPrimitiveProps,
  type TabsContentProps as TabsContentPrimitiveProps,
  type TabsContentsProps as TabsContentsPrimitiveProps,
} from '@/components/animate-ui/primitives/radix/tabs';
import { cn } from '@/lib/utils';

type TabsProps = TabsPrimitiveProps;

function Tabs(props: TabsProps) {
  return <TabsPrimitive data-slot="tabs" {...props} />;
}

type TabsListProps = TabsListPrimitiveProps;

function TabsList({ className, activeClassName, ...props }: TabsListProps) {
  return (
    <TabsListPrimitive
      data-slot="tabs-list"
      className={cn(
        // NOTE: never center an overflowing scroll row — justify-center
        // pushes the start out of reach. Start-aligned on small screens,
        // centered only when the triggers fit.
        'flex w-full items-center gap-1 rounded-full border border-kmt-gold/25 bg-black/40 p-1.5 max-sm:justify-start sm:justify-center',
        className,
      )}
      activeClassName={cn('rounded-full bg-kmt-gold', activeClassName)}
      {...props}
    />
  );
}

type TabsTriggerProps = TabsTriggerPrimitiveProps;

function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsTriggerPrimitive
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors duration-200',
        'text-amber-100/60 hover:text-amber-50',
        'data-[state=active]:text-[#120d07]',
        'data-[disabled]:cursor-default data-[disabled]:opacity-70 data-[disabled]:hover:text-amber-100/60 data-[disabled]:data-[state=active]:hover:text-[#120d07]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold',
        className,
      )}
      {...props}
    />
  );
}

type TabsContentProps = TabsContentPrimitiveProps;

function TabsContent(props: TabsContentProps) {
  return <TabsContentPrimitive data-slot="tabs-content" {...props} />;
}

type TabsContentsProps = TabsContentsPrimitiveProps;

function TabsContents(props: TabsContentsProps) {
  return <TabsContentsPrimitive data-slot="tabs-contents" {...props} />;
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsContents,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
  type TabsContentsProps,
};
