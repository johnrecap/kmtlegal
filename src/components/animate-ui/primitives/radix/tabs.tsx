'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import {
  AnimatePresence,
  motion,
  type HTMLMotionProps,
} from 'motion/react';

import { getStrictContext } from '@/lib/get-strict-context';
import { usePrefersReducedMotion } from '@/lib/use-reduced-motion';
import { useControlledState } from '@/hooks/use-controlled-state';
import { cn } from '@/lib/utils';

type TabsContextType = {
  value: string;
  setValue: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
};

const [TabsProvider, useTabs] = getStrictContext<TabsContextType>('TabsContext');

type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root> & {
  children: React.ReactNode;
};

function Tabs({
  value: valueProps,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  ...props
}: TabsProps) {
  const [value, setValue] = useControlledState({
    value: valueProps,
    defaultValue: defaultValue ?? '',
    onChange: onValueChange,
  });

  return (
    <TabsProvider value={{ value, setValue, orientation }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        value={value}
        onValueChange={setValue}
        orientation={orientation}
        {...props}
      />
    </TabsProvider>
  );
}

type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List> & {
  activeClassName?: string;
};

function TabsList({ children, className, activeClassName, ...props }: TabsListProps) {
  const { value, orientation } = useTabs();
  const reduceMotion = usePrefersReducedMotion();
  const listRef = React.useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = React.useState({ left: 0, top: 0, width: 0, height: 0, visible: false });

  const measure = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>('[data-state="active"]');
    if (!active) {
      setIndicator((prev) => ({ ...prev, visible: false }));
      return;
    }
    // Bounding-rect math is direction-agnostic: correct in LTR and RTL.
    const listRect = list.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    setIndicator({
      left: rect.left - listRect.left,
      top: rect.top - listRect.top,
      width: rect.width,
      height: rect.height,
      visible: true,
    });
  }, []);

  React.useLayoutEffect(() => {
    measure();
  }, [value, children, measure]);

  React.useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    const fonts = (document as Document).fonts;
    fonts?.ready.then(measure).catch(() => undefined);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn('relative', className)}
      {...props}
    >
      {children}
      {indicator.visible && (
        <motion.span
          aria-hidden="true"
          data-slot="tabs-indicator"
          className={cn('pointer-events-none absolute', activeClassName)}
          initial={false}
          animate={{
            x: orientation === 'horizontal' ? indicator.left : 0,
            y: orientation === 'vertical' ? indicator.top : 0,
            width: indicator.width,
            height: indicator.height,
            opacity: 1,
          }}
          transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 42 }}
          style={{ left: 0, top: 0 }}
        />
      )}
    </TabsPrimitive.List>
  );
}

type TabsTriggerProps = React.ComponentProps<typeof TabsPrimitive.Trigger>;

function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn('relative z-10', className)}
      {...props}
    />
  );
}

type TabsContentProps = React.ComponentProps<'div'> & {
  value: string;
};

function TabsContent({ className, value, ...props }: TabsContentProps) {
  return (
    <div data-slot="tabs-content" data-value={value} className={cn('relative z-10', className)} {...props} />
  );
}

type TabsContentsProps = React.ComponentProps<'div'> & {
  children: React.ReactNode;
};

function TabsContents({ children, className, ...props }: TabsContentsProps) {
  const { value } = useTabs();
  const reduceMotion = usePrefersReducedMotion();
  const active = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && (child.props as { value?: string }).value === value,
  );
  return (
    <div data-slot="tabs-contents" className={cn('relative', className)} {...props}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={value || 'empty'}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeOut' }}
        >
          {active}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TabsContents,
  useTabs,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentProps,
  type TabsContentsProps,
  type HTMLMotionProps as TabsMotionProps,
};
