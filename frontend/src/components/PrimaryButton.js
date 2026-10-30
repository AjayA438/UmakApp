import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';

/**
 * The one button used across the app.
 * variant: primary | outline | ghost | danger
 */
export default function PrimaryButton({ title, onPress, variant = 'primary', loading, disabled, icon: Icon, className = '' }) {
  const isDisabled = disabled || loading;

  const styles = {
    primary: 'bg-primary',
    outline: 'border border-primary bg-white',
    ghost: 'bg-primary-50',
    danger: 'bg-danger',
  }[variant];

  const textColor = {
    primary: 'text-white',
    outline: 'text-primary',
    ghost: 'text-primary',
    danger: 'text-white',
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`h-[52px] flex-row items-center justify-center gap-2 rounded-2xl px-6 active:opacity-80 ${styles} ${
        isDisabled ? 'opacity-60' : ''
      } ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#14532D' : '#FFFFFF'} />
      ) : (
        <>
          {Icon ? <Icon size={18} color={variant === 'outline' || variant === 'ghost' ? '#14532D' : '#FFFFFF'} /> : null}
          <Text className={`font-inter-semibold text-[15px] ${textColor}`}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}
