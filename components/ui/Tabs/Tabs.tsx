"use client";

import React, { createContext, useContext, useState } from 'react';
import styles from './Tabs.module.css';

interface TabsContextType {
    activeTab: string;
    setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
    defaultValue: string;
    children: React.ReactNode;
    className?: string;
}

export const Tabs = ({ defaultValue, children, className }: TabsProps) => {
    const [activeTab, setActiveTab] = useState(defaultValue);

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={`${styles.container} ${className || ''}`}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};

export const TabsList = ({ children }: { children: React.ReactNode }) => {
    return <div className={styles.tabList}>{children}</div>;
};

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
}

export const TabsTrigger = ({ value, children, ...props }: TabsTriggerProps) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    return (
        <button
            className={styles.tabTrigger}
            data-state={context.activeTab === value ? "active" : "inactive"}
            onClick={() => context.setActiveTab(value)}
            {...props}
        >
            {children}
        </button>
    );
};

interface TabsContentProps {
    value: string;
    children: React.ReactNode;
}

export const TabsContent = ({ value, children }: TabsContentProps) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    if (context.activeTab !== value) return null;

    return <div className={styles.tabContent}>{children}</div>;
};
