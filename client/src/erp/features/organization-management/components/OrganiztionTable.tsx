import React from "react";
import { PMSDetails } from "./OrganizationsSetupForm";

interface Organization {
  name: string;
  email: string;
  address: string;
}

interface SuperAdmin {
  name: string;
  email: string;
}

interface SubmittedData {
  organization: Organization;
  superAdmin: SuperAdmin;
  pmsList: PMSDetails[];
}

interface OrganizationTableProps {
  submittedData: SubmittedData[];
}

const OrganizationTable: React.FC<OrganizationTableProps> = ({ submittedData }) => {
 console.log("submittedData", submittedData);

  return (
    <div className="mt-6">
      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3 border text-gray-700">Organizations</th>
            <th className="p-3 border text-gray-700">Super Admin</th>
            <th className="p-3 border text-gray-700">PMS List</th>
          </tr>
        </thead>
        <tbody>
          {submittedData.map((data, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {/* Organization Details */}
              <td className="p-3 border align-top">
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-gray-800">Name:</span>
                    <p className="text-gray-700">{data.organization.name}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Email:</span>
                    <p className="ml-2 text-gray-700">{data.organization.email}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Address:</span>
                    <p className="ml-2 text-gray-700">{data.organization.address}</p>
                  </div>
                </div>
              </td>

              {/* Super Admin Details */}
              <td className="p-3 border align-top">
                <div className="space-y-2">
                  <div>
                    <span className="font-semibold text-gray-800">Name:</span>
                    <p className="ml-2 text-gray-700">{data.superAdmin.name}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">Email:</span>
                    <p className="ml-2 text-gray-700">{data.superAdmin.email}</p>
                  </div>
                </div>
              </td>

              {/* PMS List */}
              <td className="p-3 border align-top">
                <div className="space-y-3">
                  {data.pmsList.length > 0 ? (
                    data.pmsList.map((pms, i) => (
                      <div
                        key={i}
                        className="border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <span className="font-medium">Name:</span><p className="font-semibold text-gray-800">{pms.pmsName}</p>
                        
                          <span className="font-medium">Client ID:</span> {pms.clientId} <br />
                          <span className="font-medium">Secret ID:</span> {pms.secretId} <br />
                          <span className="font-medium">Location:</span> {pms.location} <br />
                          <span className="font-medium">Account:</span> {pms.account}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm italic">No PMS added</p>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrganizationTable;
