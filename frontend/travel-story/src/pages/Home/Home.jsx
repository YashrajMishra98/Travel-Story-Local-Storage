/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import AddEditTravelStory from "./AddEditTravelStory";
import {MdAdd} from "react-icons/md";
import axiosInstance from "../../utils/axiosInstance";
import TravelStoryCard from "../../components/Cards/TravelStoryCard";
import { ToastContainer, toast } from "react-toastify";
import Modal from "react-modal";
import "react-toastify/dist/ReactToastify.css";
import ViewTravelStory from "./ViewTravelStory";
import EmptyCard from "../../components/Cards/EmptyCard";
import EmptyImg from "../../assets/images/add-story.png";

const Home = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [allStories, setAllStories] = useState([]);
  const [openAddEditModal, setOpenAddEditModal] = useState({
    isShown: false,
    type: "add",
    data: null,
  });
  const [openViewModal, setOpenViewModal] = useState({
    isShown: false,
    data: null,
  });

  // Get User Info
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        // Set user info if data exists
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // If unauthorized, clear token and redirect to login
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  // Get All Travel Stories
  const getAllTravelStories = async () => {
    try {
      const response = await axiosInstance.get("/get-all-stories");
      if (response.data && response.data.stories) {
        setAllStories(response.data.stories);
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again." + error);
    }
  };

  // Handle Edit Story
  const handleEdit = (data) => {
    setOpenAddEditModal({ isShown: true, type: "edit", data: data });
  };

  // Handle Travel Story Click
  const handleViewStory = (data) => {
    setOpenViewModal({ isShown: true, data });
  };

  // Update Favourite Status
  const updateIsFavorite = async (storyData) => {
    const storyId = storyData._id;

    try {
      const response = await axiosInstance.put(
        "/update-is-favorite/" + storyId,
        {
          isFavorite: !storyData.isFavorite,
        },
      );

      if (response.data && response.data.story) {
        toast.success("Favorite status updated successfully!");
        getAllTravelStories();
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again.");
    }
  };

  // Delete Story
  const deleteTravelStory = async (data) => {
    const storyId = data._id;

    try {
      const response = await axiosInstance.delete("/delete-story/" + storyId);

      if (response.data && !response.data.error) {
        toast.error("Story Deleted Successfully");
        setOpenViewModal((prevState) => ({ ...prevState, isShown: false }));
        getAllTravelStories();
      }
    } catch (error) {
      console.log("An unexpected error occurred. Please try again." + error);
    }
  };

  useEffect(() => {
    getAllTravelStories();
    getUserInfo();
    return () => {};
  }, [navigate]);

  return (
    <>
        <Navbar userInfo={userInfo} />
        <div className="container mx-auto py-10">
            <div className="flex gap-7">
            <div className="flex-1">
                {allStories.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    {allStories.map((item) => {
                    return (
                        <TravelStoryCard
                        key={item._id}
                        imgUrl={item.imageUrl}
                        title={item.title}
                        story={item.story}
                        date={item.visitedDate}
                        visitedLocation={item.visitedLocation}
                        isFavorite={item.isFavorite}
                        onEdit={() => handleEdit(item)}
                        onClick={() => handleViewStory(item)}
                        onFavoriteClick={() => updateIsFavorite(item)}
                        />
                    );
                    })}
                </div>
                ) : (
                  <EmptyCard imgSrc={EmptyImg} message={`Start creating your first Travel Story! Click the 'Add' button to jot down your thoughts, ideas, and memories. Let's get started!`} />
                )}
            </div>

            <div className="w-[320px]"></div>
            </div>
        </div>

        {/* Add & Edit Travel Story Modal */}
        <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() => {}}
        style={{
            overlay: {
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: 999,
            },
        }}
        appElement={document.getElementById("root")}
        className="modal-box"
        >

        <AddEditTravelStory 
          type={openAddEditModal.type}
          storyInfo={openAddEditModal.data}
          onClose={() => {
          setOpenAddEditModal({ isShown: false, type: "add", data: null });
          }}
          getAllTravelStories={getAllTravelStories}
        />
        </Modal>

        {/* View Travel Story Model */}
        <Modal
          isOpen={openViewModal.isShown}
          onRequestClose={() => {}}
          style={{
            overlay: {
              backgroundColor: "rgba(0,0,0,0.2)",
              zIndex: 999,
            },
          }}
          appElement={document.getElementById("root")}
          className="modal-box"
        >
          <ViewTravelStory
            type={openViewModal.type}
            storyInfo={openViewModal.data || null}
            onClose={() => {
              setOpenViewModal((prevState) => ({ ...prevState, isShown: false}));
            }}
            onEditClick={() => {
              setOpenViewModal((prevState) => ({ ...prevState, isShown: false}));
              handleEdit(openViewModal.data || null)
            }}
            onDeleteClick={async () => {
              deleteTravelStory(openViewModal.data || null);
            }}
          />
        </Modal>


        <button
        className="w-16 h-16 flex items-center justify-center rounded-full bg-primary hover:bg-cyan-400 fixed right-10 bottom-10"
        onClick={() => {
            setOpenAddEditModal({ isShown: true, type: "add", data: null });
        }}
        >
            <MdAdd className="text-[32px] text-white" />
        </button>
        

        <ToastContainer />

    </>
  );
};

export default Home;
