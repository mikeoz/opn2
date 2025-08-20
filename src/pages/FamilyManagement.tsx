import React from 'react';
import MobileLayout from '@/components/MobileLayout';
import { FamilyManagement as FamilyManagementComponent } from '@/components/FamilyManagement';

const FamilyManagement = () => {
  return (
    <MobileLayout>
      <div className="p-4">
        <FamilyManagementComponent />
      </div>
    </MobileLayout>
  );
};

export default FamilyManagement;